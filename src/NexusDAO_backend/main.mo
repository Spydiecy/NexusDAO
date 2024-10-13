import Array "mo:base/Array";
import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor NexusDAO {
    // Types
    type UserId = Text;
    type TaskId = Nat;
    type FileId = Nat;

    type Role = {
        #Council;
        #Subcontractor;
        #Reviewer;
    };

    type User = {
        id: UserId;
        username: Text;
        role: Role;
        reputation: Nat;
    };

    type Task = {
        id: TaskId;
        title: Text;
        description: Text;
        status: TaskStatus;
        assignee: ?UserId;
        creator: UserId;
        deadline: Time.Time;
        priority: Nat;
        attachments: [FileId];
    };

    type TaskStatus = {
        #Open;
        #InProgress;
        #UnderReview;
        #Completed;
    };

    type File = {
        id: FileId;
        name: Text;
        contentType: Text;
        size: Nat;
        uploadedBy: UserId;
        uploadedAt: Time.Time;
        data: Blob;
    };

    type Credentials = {
        username: Text;
        passwordHash: Nat32;
    };

    // State
    private stable var nextTaskId: TaskId = 0;
    private stable var nextFileId: FileId = 0;
    private var users = HashMap.HashMap<UserId, User>(0, Text.equal, Text.hash);
    private var credentials = HashMap.HashMap<Text, Credentials>(0, Text.equal, Text.hash);
    private var tasks = HashMap.HashMap<TaskId, Task>(0, Nat.equal, Hash.hash);
    private var files = HashMap.HashMap<FileId, File>(0, Nat.equal, Hash.hash);

    // Helper functions
    private func hashPassword(password: Text) : Nat32 {
        Text.hash(password)
    };

    // User Management
    public func register(username: Text, password: Text, role: Role) : async Result.Result<(), Text> {
        switch (credentials.get(username)) {
            case (?_) { #err("Username already taken") };
            case null {
                let passwordHash = hashPassword(password);
                let newCredentials: Credentials = {
                    username = username;
                    passwordHash = passwordHash;
                };
                credentials.put(username, newCredentials);
                
                let newUser: User = {
                    id = username;
                    username = username;
                    role = role;
                    reputation = 0;
                };
                users.put(username, newUser);
                #ok(())
            };
        }
    };

    public query func login(username: Text, password: Text) : async Result.Result<User, Text> {
        switch (credentials.get(username)) {
            case (?userCredentials) {
                let passwordHash = hashPassword(password);
                if (userCredentials.passwordHash == passwordHash) {
                    switch (users.get(username)) {
                        case (?user) { #ok(user) };
                        case null { #err("User not found") };
                    }
                } else {
                    #err("Invalid credentials")
                }
            };
            case null { #err("User not found") };
        }
    };

    public shared(msg) func updateUserRole(userId: UserId, newRole: Role) : async Result.Result<(), Text> {
        assert(isCouncilMember(msg.caller));
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    id = user.id;
                    username = user.username;
                    role = newRole;
                    reputation = user.reputation;
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") };
        }
    };

    // Task Management
    public shared(msg) func createTask(title: Text, description: Text, deadline: Time.Time, priority: Nat) : async Result.Result<TaskId, Text> {
        assert(isCouncilMember(msg.caller));
        let taskId = nextTaskId;
        nextTaskId += 1;
        let newTask: Task = {
            id = taskId;
            title = title;
            description = description;
            status = #Open;
            assignee = null;
            creator = Principal.toText(msg.caller);
            deadline = deadline;
            priority = priority;
            attachments = [];
        };
        tasks.put(taskId, newTask);
        #ok(taskId)
    };

    public shared(msg) func assignTask(taskId: TaskId) : async Result.Result<(), Text> {
        assert(isSubcontractor(msg.caller));
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.status != #Open) {
                    return #err("Task is not open for assignment");
                };
                let updatedTask = {
                    id = task.id;
                    title = task.title;
                    description = task.description;
                    status = #InProgress;
                    assignee = ?Principal.toText(msg.caller);
                    creator = task.creator;
                    deadline = task.deadline;
                    priority = task.priority;
                    attachments = task.attachments;
                };
                tasks.put(taskId, updatedTask);
                #ok(())
            };
            case null { #err("Task not found") };
        }
    };

    public shared(msg) func submitTaskForReview(taskId: TaskId) : async Result.Result<(), Text> {
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.assignee != ?Principal.toText(msg.caller)) {
                    return #err("You are not assigned to this task");
                };
                if (task.status != #InProgress) {
                    return #err("Task is not in progress");
                };
                let updatedTask = {
                    id = task.id;
                    title = task.title;
                    description = task.description;
                    status = #UnderReview;
                    assignee = task.assignee;
                    creator = task.creator;
                    deadline = task.deadline;
                    priority = task.priority;
                    attachments = task.attachments;
                };
                tasks.put(taskId, updatedTask);
                #ok(())
            };
            case null { #err("Task not found") };
        }
    };

    public shared(msg) func reviewTask(taskId: TaskId, approved: Bool) : async Result.Result<(), Text> {
        assert(isReviewer(msg.caller));
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.status != #UnderReview) {
                    return #err("Task is not under review");
                };
                let newStatus = if (approved) { #Completed } else { #InProgress };
                let updatedTask = {
                    id = task.id;
                    title = task.title;
                    description = task.description;
                    status = newStatus;
                    assignee = task.assignee;
                    creator = task.creator;
                    deadline = task.deadline;
                    priority = task.priority;
                    attachments = task.attachments;
                };
                tasks.put(taskId, updatedTask);
                if (approved) {
                    switch (task.assignee) {
                        case (?assignee) { await updateUserReputation(assignee, 1) };
                        case null { /* No assignee, do nothing */ };
                    };
                };
                #ok(())
            };
            case null { #err("Task not found") };
        }
    };

    // File Management
    public shared(msg) func uploadFile(name: Text, contentType: Text, data: Blob) : async Result.Result<FileId, Text> {
        let fileId = nextFileId;
        nextFileId += 1;
        let newFile: File = {
            id = fileId;
            name = name;
            contentType = contentType;
            size = Blob.toArray(data).size();
            uploadedBy = Principal.toText(msg.caller);
            uploadedAt = Time.now();
            data = data;
        };
        files.put(fileId, newFile);
        #ok(fileId)
    };

    public shared(msg) func attachFileToTask(taskId: TaskId, fileId: FileId) : async Result.Result<(), Text> {
        switch (tasks.get(taskId), files.get(fileId)) {
            case (?task, ?_) {
                if (task.creator != Principal.toText(msg.caller) and task.assignee != ?Principal.toText(msg.caller)) {
                    return #err("You don't have permission to attach files to this task");
                };
                let updatedTask = {
                    id = task.id;
                    title = task.title;
                    description = task.description;
                    status = task.status;
                    assignee = task.assignee;
                    creator = task.creator;
                    deadline = task.deadline;
                    priority = task.priority;
                    attachments = Array.append(task.attachments, [fileId]);
                };
                tasks.put(taskId, updatedTask);
                #ok(())
            };
            case (null, _) { #err("Task not found") };
            case (_, null) { #err("File not found") };
        }
    };

    // Helper functions
    private func isCouncilMember(principal: Principal) : Bool {
        switch (users.get(Principal.toText(principal))) {
            case (?user) { user.role == #Council };
            case null { false };
        }
    };

    private func isSubcontractor(principal: Principal) : Bool {
        switch (users.get(Principal.toText(principal))) {
            case (?user) { user.role == #Subcontractor };
            case null { false };
        }
    };

    private func isReviewer(principal: Principal) : Bool {
        switch (users.get(Principal.toText(principal))) {
            case (?user) { user.role == #Reviewer };
            case null { false };
        }
    };

    private func updateUserReputation(userId: UserId, change: Int) : async () {
        switch (users.get(userId)) {
            case (?user) {
                let newReputation = Nat.max(0, Int.abs(Int.add(user.reputation, change)));
                let updatedUser = {
                    id = user.id;
                    username = user.username;
                    role = user.role;
                    reputation = newReputation;
                };
                users.put(userId, updatedUser);
            };
            case null { /* User not found, do nothing */ };
        }
    };

    // Query functions
    public query func getUser(userId: UserId) : async ?User {
        users.get(userId)
    };

    public query func getTask(taskId: TaskId) : async ?Task {
        tasks.get(taskId)
    };

    public query func getFile(fileId: FileId) : async ?File {
        files.get(fileId)
    };

    public query func getAllTasks() : async [Task] {
        Iter.toArray(tasks.vals())
    };

    public query func getTasksByStatus(status: TaskStatus) : async [Task] {
        Iter.toArray(Iter.filter(tasks.vals(), func (task: Task) : Bool { task.status == status }))
    };

    public query func getTasksByAssignee(assignee: UserId) : async [Task] {
        Iter.toArray(Iter.filter(tasks.vals(), func (task: Task) : Bool { task.assignee == ?assignee }))
    };
}