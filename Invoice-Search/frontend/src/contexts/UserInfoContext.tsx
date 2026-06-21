import { useState, useEffect } from "react";

// Interface Imports  
import { getUserEmail, getUserName } from "@/interface/AuthMe/getAuthMe";

export const useUserId = () => {
    const [userId, setUserId] = useState("");

    useEffect(() => {
        const fetchUserEmail = async () => {
            const userEmail = await getUserEmail();
            setUserId(userEmail);
        }

        fetchUserEmail();
    }, []);

    return userId;
}

export const useUserName = () => {
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const fetchUserName = async () => {
            const name = await getUserName();
            setUserName(name);
        }

        fetchUserName();
    }, []);

    return userName;
}  
