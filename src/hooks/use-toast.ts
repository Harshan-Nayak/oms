import { toast } from "react-hot-toast";

type ToastType = "success" | "error" | "loading" | "info" | "warning";

export const useToast = () => {
  const showToast = (
    message: string,
    type: ToastType = "success",
    duration: number = 4000
  ) => {
    switch (type) {
      case "success":
        toast.success(message, { duration });
        break;
      case "error":
        toast.error(message, { duration });
        break;
      case "loading":
        toast.loading(message, { duration });
        break;
      default:
        toast(message, { duration });
        break;
    }
  };

  return { showToast };
};