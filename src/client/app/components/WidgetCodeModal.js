import React, { useState, useEffect } from 'react';
import { Modal, Button, Segment, Input, Message, Divider } from 'semantic-ui-react';
import { prettifyIdentifier } from 'services/UtilityService';


function getScript(uid, sensor, title) {
  return `
<div class="sensefarm-widget" data-uid="${uid}" data-sensor="${sensor}" data-title="${title}"></div>
<script type="text/javascript">
(function() {
  var s=document.createElement('script'); s.type='text/javascript'; s.async=true; s.src='https://hub.sensefarm.com/widget/widget.js';
  var l=document.createElement('link'); l.type='text/css'; l.rel='stylesheet'; l.href='https://hub.sensefarm.com/widget/widget.css';
  var head=document.getElementsByTagName('head')[0]; head.appendChild(s); head.appendChild(l);
})();
</script>
  `.trim();
}

export default function WidgetCodeModal(props) {


  let [title, setTitle] = useState('');

  //const [title,setTitle] = useState('');
  const titleChanged = (e,data) => {
    setTitle(data.value);
  };

  useEffect(()=>{
    setTitle(prettifyIdentifier(props.sensor));
  },[props.sensor]);

  return (
    <Modal open={props.open} closeIcon onClose={props.onClose} centered={true}>
      <Modal.Header>Sensor Widget</Modal.Header>
      <Modal.Content>
        <Input fluid type='text' label='Title' value={title} onChange={titleChanged} />
        <Segment style={{ overflowX: 'auto' }} secondary>
          <pre>{ getScript(props.uid, props.sensor, title) }</pre>
        </Segment>
        <Message positive>
          Insert this code snippet in the <strong>&lt;body&gt;</strong> tag of your webpage where you want the widget to be displayed. 
          If you already have another Sensefarm widget on your page you only need to add the first line above. 
          The widget can be styled using CSS to fit your design.
        </Message>
        <Divider horizontal>Or</Divider>
        <Input fluid type='text' readOnly label='URL' value={'https://hub.sensefarm.com/api/v1/devices/check/' + props.uid} />
        <Message positive>
          You can use this url to get the latest data for the device in <strong>JSON</strong> format.
        </Message>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Close" onClick={props.onClose} />
      </Modal.Actions>
    </Modal>
  );
}