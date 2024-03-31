import React, { useState } from 'react';
import { Button, Popup } from 'semantic-ui-react';

export default function SafeButton({
	onClick = () => { },
	content = '',
	warningContent = '',
	disabled = false,
	color = 'red',
	warningMessage = 'Are you sure?',
	customDataCy = null,
	...props
}) {

	const [popupOpen, setPopupOpen] = useState(false);

	function onClickPrompt() {
		onClick();
		setPopupOpen(false);
	}

	return (
		<Popup
			trigger={
				<Button
					onClick={() => setPopupOpen(true)}
					//outside props
					color={color}
					disabled={disabled}
					content={content}
					data-cy={customDataCy || content.toLowerCase()}
					{...props}
				/>
			}
			content={
				<>
					{warningMessage} <br />
					<Button
						color={color}
						onClick={onClickPrompt}
						disabled={disabled}
						content={warningContent || content}
						data-cy={'sureTo' + content}
					/>
				</>
			}
			on='click'
			open={popupOpen}
			onClose={() => setPopupOpen(false)}
			onOpen={() => setPopupOpen(true)}
			position='top right'
		/>
	);

}