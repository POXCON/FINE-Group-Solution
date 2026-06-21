export const getUserEmail = async () => {
    if (import.meta.env.MODE === "production") {
        const res = await fetch("/.auth/me");
        const data = await res.json();
        const userEmail = data[0]["user_id"];
        return userEmail;
    } else {
        return "Test User";
    }
};

export const getUserName = async () => {
    if (import.meta.env.MODE === "production") {
        const res = await fetch("/.auth/me");
        const data = await res.json();
        const claims = data[0]["user_claims"];
        const userName = claims.find((claims: { typ: string; val: string }) => claims.typ === "name")?.val;
        return userName;
    } else {
        return "Test User";
    }
};  