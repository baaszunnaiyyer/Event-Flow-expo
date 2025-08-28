import Toast from "react-native-toast-message";
import { db } from "./schema";

export async function getContacts(user_id:string) {
    try {
        const result = await db.getAllAsync("SELECT * FROM contacts WHERE user_id = ?", [user_id])
        if (!result) {
            return { success: false, error: "Event Requests Not Found" };
        }
        return { success: true, data: result };
    } catch (error) {
        Toast.show({ type: "error", text1: "Fetch Error", text2: `${error}` });
        console.error("Error fetching Contacts:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteContact(contact_user_id : string){
    try {

        const result = await db.runAsync('DELETE FROM contacts WHERE contact_user_id = ?', [contact_user_id])

        if (result.changes === 0) {
            return { success: false, error: "Contact not Deleted" };    
        }

        return { success: true, message: "Contact Deleted Successfully" };
    } catch (error) {
        Toast.show({ type: "error", text1: "Delete Error", text2: `${error}` });
        console.error("Error Deleting Contact:", error);
        return { success: false, error: String(error) };
    }
}