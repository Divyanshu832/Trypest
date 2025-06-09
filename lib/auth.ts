
'use client'

import { signOut, useSession } from "next-auth/react";

export const  useAuth = () =>{


    const { data : user } = useSession();

     
  
    const isAuthenticated = () => {
        // Check if the session exists and has a user
        return user && user.user;
    }       

    const isAdmin = () => {
        // Check if the user has an admin role
        return user && user.user.role === 'admin';
    }   

    const isAccountant = () => {
        // Check if the user has an accountant role
        return user && user.user.role === 'accountant';
    }   

    const logout = () => {
        // Implement logout functionality
        if (user) {
            signOut({
                callbackUrl: '/',
                redirect: true,
            })
        }
    }   
    return {
        isAuthenticated,
        isAdmin,
        isAccountant,
        logout,
        user: user ? user.user : null,
        hasPermission  :(type:string) => true
    };  
 
}