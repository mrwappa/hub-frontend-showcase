import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://image-upload.sensefarm.com/'
});

// Add a request interceptor
instance.interceptors.request.use((config) => {
	config.headers = {
		'accept': 'application/json',
    "Content-Type": "multipart/form-data"
	};
  return config;
});

// Add response interceptor
instance.interceptors.response.use(
  async (response) => {
    return response;
  },
  async () => { }
);


instance.upload = async (imageData) => {
  let res = await instance.post('image-upload', imageData);
	return res;
};

export default instance;