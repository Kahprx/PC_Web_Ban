import toast from 'react-hot-toast';

export const notifySuccess = (message) => {
  toast.success(message || 'Thao tac thanh cong');
};

export const notifyError = (error, fallback = 'Co loi xay ra') => {
  const message = typeof error === 'string' ? error : error?.message || fallback;
  toast.error(message, { id: `err-${message}` });
};

export const notifyInfo = (message) => {
  toast(message || 'Thong bao');
};
