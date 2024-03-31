import React, { useState } from 'react';
import { Button, Popup } from 'semantic-ui-react';
import ImageUploadService from '../services/ImageUploadService';
import OutsideClickHandler from 'react-outside-click-handler';

const acceptedFileUploadExtension = '.jpg,.jpeg,.png,.gif,.mov,.mp4,.webm,.mkv';
const acceptedImageUploadExtensions = '.jpg,.jpeg,.png,.gif';
const hundredMegabytes = 104857600;

export default function UploadMediaButton(props) {

	const [fileInputRef] = useState(React.createRef());
	const [sizeWarningOpen, setSizeWarningOpen] = useState(false);

	function getImageSize(file) {
		let size = {};
		let img = new Image();
		var objectUrl = global.URL.createObjectURL(file);
		img.onload = function () {
			size.width = this.width;
			size.height = this.height;
			global.URL.revokeObjectURL(objectUrl);
		};
		img.src = objectUrl;
		return size;
	}

	async function uploadImage(aSelectedFile) {
		if (aSelectedFile) {
			props.setLoading(true);
			const formData = new FormData();
			if (aSelectedFile.size < hundredMegabytes) {
				formData.append('image', aSelectedFile);
				let imgSize = getImageSize(aSelectedFile);
			
				let res = await ImageUploadService.upload(formData);
				if (res.data && res.data.image_url) {
					props.onUploadSuccess(res.data.image_url, imgSize);
				}
			}
			else {
				setSizeWarningOpen(false);
			}
			props.setLoading(false);
		}
	}

	function setFile(event) {
		uploadImage(event.target.files[0]);
	}

	function onUploadClick() {
		fileInputRef.current.click();
	}

	return (
		<Popup
			wide
			trigger=
			{
				<span>
					<Button
						icon='picture'
						content={props.content}
						onClick={onUploadClick}
						floated={props.floated}
					/>
					<input
						ref={fileInputRef}
						accept={props.onlyImages ? acceptedImageUploadExtensions : acceptedFileUploadExtension}
						type="file"
						hidden
						onChange={setFile}
					/>
				</span>
			}
			position='bottom left'
			open={sizeWarningOpen}
		>
			<OutsideClickHandler
				onOutsideClick={() => {
					setSizeWarningOpen(false);
				}}
			>
				{"File too large. File size limited to 100MB"}
			</OutsideClickHandler>
		</Popup>
	);
}