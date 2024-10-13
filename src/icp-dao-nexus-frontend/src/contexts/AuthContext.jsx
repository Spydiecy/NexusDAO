import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/icp_dao_nexus_backend/index';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [actor, setActor] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        handleAuthenticated(client);
      }
    };

    initAuth();
  }, []);

  const handleAuthenticated = async (client) => {
    const identity = client.getIdentity();
    const agent = new HttpAgent({ identity });
    const newActor = Actor.createActor(idlFactory, {
      agent,
      canisterId: process.env.CANISTER_ID_ICP_DAO_NEXUS_BACKEND,
    });
    setActor(newActor);
    setIsAuthenticated(true);

    // Fetch user profile
    const profileResult = await newActor.getProfile();
    if ('ok' in profileResult) {
      setUserProfile(profileResult.ok);
    }
  };

  const login = async () => {
    await authClient.login({
      identityProvider: process.env.II_URL,
      onSuccess: () => {
        handleAuthenticated(authClient);
      },
    });
  };

  const logout = async () => {
    await authClient.logout();
    setIsAuthenticated(false);
    setUserProfile(null);
    setActor(null);
  };

  const registerUser = async (username, role) => {
    if (!actor) return;
    const result = await actor.registerUser(username, role);
    if ('ok' in result) {
      const profileResult = await actor.getProfile();
      if ('ok' in profileResult) {
        setUserProfile(profileResult.ok);
      }
    }
    return result;
  };

  const value = {
    isAuthenticated,
    userProfile,
    login,
    logout,
    registerUser,
    actor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};