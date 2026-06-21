export const sendCustomTraceLog = async (message: string, user: string, level: string, file_name: string) => {
    try {
        const requestBody = {
            message: message,
            userId: user,
            level: level,
            fileName: file_name,
            isDebug: import.meta.env.MODE === "development" ? true : false
        }

        const response = await fetch(
            import.meta.env.VITE_APP_API_URL + "api/sendlog",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody)
            }
        )

        if (!response.ok) {
            console.error("Network response was not ok: " + response.text);
            return;
        }

        console.log("sendCustomTraceLog succeeded.");

        return;
    } catch (error) {
        console.error("There was an error while sending custom trace log: " + error);
        return;
    }
}  
