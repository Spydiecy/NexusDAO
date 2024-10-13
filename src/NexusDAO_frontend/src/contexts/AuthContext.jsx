import React, { createContext, useContext, useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../declarations/NexusDAO_backend';
import { canisterId } from '../../../declarations/NexusDAO_backend/index';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [actor, setActor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const host = process.env.DFX_NETWORK === 'local' ? 'http://localhost:8000' : 'https://ic0.app';
        const agent = new HttpAgent({ host });

        if (process.env.DFX_NETWORK === 'local') {
          await agent.fetchRootKey().catch(console.error);
        }

        const newActor = Actor.createActor(idlFactory, { agent, canisterId });
        setActor(newActor);
      } catch (error) {
        console.error("Failed to initialize actor:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async (username, password) => {
    if (!actor) {
      throw new Error("Actor not initialized");
    }
    try {
      const result = await actor.login(username, password);
      if ('ok' in result) {
        setUser(result.ok);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(result.ok));
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username, password, role) => {
    if (!actor) {
      throw new Error("Actor not initialized");
    }
    try {
      const result = await actor.register(username, password, { [role]: null });
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
    actor,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};