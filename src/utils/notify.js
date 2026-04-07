import toast from 'react-hot-toast';

export const notifySuccess = (message) => {
  toast.success(message || 'Thao tác thành công');
};

export const notifyError = (error, fallback = 'Có lỗi xảy ra') => {
  const message = typeof error === 'string' ? error : error?.message || fallback;
  toast.error(message, { id: `err-${message}` });
};

export const notifyInfo = (message) => {
  toast(message || 'Thông báo');
};
