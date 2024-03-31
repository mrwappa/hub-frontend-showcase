import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import { Button } from 'semantic-ui-react';


export default function ColorPicker(props) {
	const [open, setOpen] = useState(false);
	const [color, setColor] = useState();

	useEffect(() => {
		setColor(props.color);
	}, [props.color]);

	function handleClick() {
		setOpen(!open);
	}

	function handleClose() {
		setOpen(false);
	}
	const popover = {
		position: 'absolute',
		zIndex: '2',
	};
	const cover = {
		position: 'fixed',
		top: '0px',
		right: '0px',
		bottom: '0px',
		left: '0px',
	};
	return (
		<div>
			<Button style={{ backgroundColor: color }} attached='left' size='mini' onClick={handleClick}>Pick Color</Button>
			{open ? <div style={popover}>
				<div style={cover} onClick={handleClose} />
				<SketchPicker color={color} onChange={(aColor) => setColor(aColor)} {...props} />
			</div> : null}
		</div>
	);
}