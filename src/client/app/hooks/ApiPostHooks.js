import { useMutation } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { errorHandler, queryClient } from './ApiQueryHooks';

export function baseMutationHook({
	apiReq,
	autoApplyRes = false,
	onSuccess,
	onError
}) {
	const navigate = useNavigate();
	const location = useLocation();

	const mutation = useMutation(
		apiReq,
		{
			onError: (err) => errorHandler(err, navigate, location, onError),
			onSuccess: (data, fields) => {
				if (typeof onSuccess === 'function') onSuccess(data && data.data, fields);

				if (autoApplyRes && data.data && data.data.updated) {
					data.data.updated.map((updatedDocument) => {
						queryClient.setQueryData([updatedDocument.key, updatedDocument.id, null], updatedDocument.data);
					});
				}
				return data;
			}
		}
	);

	return mutation;
}