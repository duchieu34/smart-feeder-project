import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ActivateAccount() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const activate = async () => {
            try {
                const res = await api.get(`/auth/activate/${token}`);
                setStatus("success");
                setMessage("Kích hoạt tài khoản thành công!");

                setTimeout(() => {
                    navigate("/login");
                }, 3000);

            } catch (err) {
                setStatus("error");
                setMessage(
                    err?.response?.data?.error ||
                    "Liên kết kích hoạt không hợp lệ hoặc đã hết hạn"
                );
            }
        };

        if (token) activate();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow text-center">

                <>
                    <h2 className="text-xl font-semibold text-green-600 mb-2">
                        Kích hoạt thành công!
                    </h2>
                    <p className="text-sm text-gray-400 mt-3">
                        Đang chuyển về trang đăng nhập...
                    </p>
                </>

            </div>
        </div>
    );
}
