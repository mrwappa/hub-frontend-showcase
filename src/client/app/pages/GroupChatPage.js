import React, { useEffect, useState } from 'react';
import PageBase from 'components/PageBase';
import { Segment, Comment, Form, Button } from 'semantic-ui-react';
import moment from 'moment';
import { deepCopy, constructComment } from 'services/UtilityService';
import { api } from 'services/ApiService';
import UploadMediaButton from 'components/UploadMediaButton';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { currentProjectHook, userHook } from '../hooks/ApiQueryHooks';
import clone from 'lodash.clone';
import { getProjectIdFromURL } from '../services/ProjectService';
import { useLocation } from 'react-router-dom';

const noMessagesAlert =
	<Comment>
		<Comment.Avatar src={require('images/apple-touch-icon.png')} />
		<Comment.Content>
			<Comment.Author>{'Greetings!'}</Comment.Author>
			<Comment.Text as='div'>Be the first to say something to the project group!</Comment.Text>
		</Comment.Content>
	</Comment>;

export default function GroupChatPage() {

	const currentProject = currentProjectHook();
	const user = userHook();

	const location = useLocation();
	const projectId = getProjectIdFromURL(location.search);

	const [allowCommentLoad, setAllowCommentLoad] = useState(true);
	const [previousScrollHeight, setPreviousScrollHeight] = useState(0);

	const [comments, setComments] = useState([]);
	const [commentField, setCommentField] = useState('');
	const [loadAmount, setLoadAmount] = useState(20);
	const [editingComment, setEditingComment] = useState({});
	const [uploadLoading, setUploadLoading] = useState(false);

	useEffect(() => {
		updateChat.mutate();
		window.addEventListener('scroll', loadMore, true);
		return () => {
			window.removeEventListener('scroll', loadMore, true);
		};
	}, []);

	const updateChat = baseMutationHook({
		apiReq: async (amount) => await api.get('organizations/' + projectId + '/chat/' + (amount || loadAmount)),
		onSuccess: (data) => {
			setComments(data);
		}
	});

	const saveEditedComment = baseMutationHook({
		apiReq: async () => await api.put('organizations/' + projectId + '/chat/' + editingComment.id, { content: editingComment.content }),
		onSuccess: async () => {
			await updateChat.mutateAsync();
			setEditingComment({});
		}
	});

	const postComment = baseMutationHook({
		apiReq: async () => await api.post('organizations/' + currentProject.data.id + '/chat', { content: commentField }),
		onSuccess: () => {
			setLoadAmount(loadAmount + 1);
			setCommentField('');
			updateChat.mutate();
		}
	});

	const removeComment = baseMutationHook({
		apiReq: async (commentId) => await api.delete('organizations/' + currentProject.data.id + '/chat/' + commentId),
		onSuccess: () => {
			updateChat.mutate();
		}
	});

	async function loadMoreComments() {
		const newAmount = loadAmount + 20;
		setLoadAmount(newAmount);
		updateChat.mutate(newAmount);
	}

	async function loadMore() {
		let main = document.getElementsByClassName("mainContent")[0];
		if (allowCommentLoad && (main.scrollTop > previousScrollHeight) && (window.innerHeight + main.scrollTop >= main.scrollHeight - 100)) {
			setAllowCommentLoad(false);
			await loadMoreComments();
			setTimeout(() => setAllowCommentLoad(true), 500);
			setPreviousScrollHeight(Number(main.scrollTop - 1));
		}
	}

	function isEditingCommment(commentId) {
		return editingComment.id === commentId;
	}

	function onEditCommentChange(event, { value }) {
		let aEditingComment = deepCopy(editingComment);
		aEditingComment.content = value;
		setEditingComment(aEditingComment);
	}

	function onClickEditComment(comment) {
		if (!comment) {
			setEditingComment({});
		}
		else {
			setEditingComment(deepCopy(comment));
		}
	}

	function applyMediaUrl(url) {
		let aCommentField = commentField + (commentField.length !== 0 ? '\n' : '') + url;
		setCommentField(aCommentField);
	}

	function applyEditMediaUrl(url) {
		let aEditingComment = clone(editingComment);
		aEditingComment.content = aEditingComment.content + (aEditingComment.content.length !== 0 ? '\n' : '') + url;
		setEditingComment(aEditingComment);
	}

	function onCommentChange(event, { value }) {
		setCommentField(value);
	}

	let chatMessages = [];

	if (currentProject.isSuccess) {
		chatMessages = comments.slice(0).reverse().map((comment, index) => {
			let member = currentProject.data.members.find((aMember) => {
				return aMember.user.id === comment.user;
			});

			let commentContent = constructComment(comment.content);

			let editingThisComment = isEditingCommment(comment.id);
			return (
				<Comment key={index}>
					<Comment.Avatar src={member.user.avatar} />
					<Comment.Content>
						<Comment.Author>{member.user.firstname + ' ' + member.user.lastname}</Comment.Author>
						<Comment.Metadata>
							<p>{comment.edited ? 'Edited ' : ''}{moment(comment.edited || comment.posted).toNow(true)} ago</p>
						</Comment.Metadata>
						{
							editingThisComment ?
								<Form reply>
									<Form.TextArea onChange={onEditCommentChange} value={editingComment.content} data-cy={'editCommentArea'} />
									<Button onClick={() => onClickEditComment(null)} content='Cancel' labelPosition='left' icon='cancel' primary />
									<Button onClick={saveEditedComment.mutate} content='Save' labelPosition='left' icon='edit' primary data-cy='saveEditedComment' />
									<UploadMediaButton
										onUploadSuccess={applyEditMediaUrl}
										setLoading={setUploadLoading}
									/>
								</Form> :
								<Comment.Text as='div' data-cy={'comment' + index}>
									{commentContent}
								</Comment.Text>
						}
					</Comment.Content>
					<Comment.Actions>
						{
							comment.user === user.data.id && !editingThisComment ?
								<div>
									<Comment.Action onClick={() => onClickEditComment(comment)} data-cy={'editComment' + index}>Edit</Comment.Action>
									<Comment.Action onClick={() => removeComment.mutate(comment.id)} data-cy={'removeComment' + index}>Remove</Comment.Action>
								</div>
								:
								null
						}
					</Comment.Actions>
				</Comment>
			);
		});
	}


	const page = (
		<Segment style={{ paddingLeft: '5%' }} loading={uploadLoading}>
			<Comment.Group size='large'>
				<Form reply>
					<Form.TextArea onChange={onCommentChange} value={commentField} data-cy='writeCommentArea' />
					<Button
						onClick={postComment.mutate}
						disabled={commentField.length === 0}
						content='Send'
						labelPosition='left'
						icon='edit'
						primary
						data-cy='submitComment'
					/>
					<UploadMediaButton
						onUploadSuccess={applyMediaUrl}
						setLoading={setUploadLoading}
					/>
				</Form>
				{
					chatMessages.length === 0 && !updateChat.isLoading ? noMessagesAlert : chatMessages
				}
			</Comment.Group>
		</Segment>
	);

	return (
		<PageBase title="Group Chat" page={page} nofooter fullsize />
	);
}


