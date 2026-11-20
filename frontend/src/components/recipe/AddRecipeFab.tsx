import { IoMdAddCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FloatingActionButton } from "../ui/FloatingActionButton";

/** The "Dodaj recept" floating button, shown on several pages to logged-in users. */
export function AddRecipeFab() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) return null;

    return (
        <FloatingActionButton
            actions={[
                {
                    label: "Dodaj recept",
                    icon: <IoMdAddCircle />,
                    color: "#4CAF50",
                    textColor: "#fff",
                    onClick: () => navigate("/addrecipe"),
                },
            ]}
        />
    );
}
