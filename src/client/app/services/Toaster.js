import { toast } from 'react-toastify';

toast.configure({
	position: toast.POSITION.TOP_RIGHT
});

export function toastSuccess(details) {
	toast.success(details);
}

export function toastError(details) {
	toast.error(details);
}