import { FC, ReactNode } from 'react';
import { DialogOverlay, DialogContent } from '@reach/dialog';
import styled from 'styled-components';
import { HEADER_HEIGHT } from 'constants/ui';

type FullScreenModalProps = {
	title: ReactNode;
	isOpen: boolean;
	children: ReactNode;
	onDismiss?: () => void;
};

export const FullScreenModal: FC<FullScreenModalProps> = ({
	title,
	children,
	isOpen,
	onDismiss,
	...rest
}) => (
	<StyledDialogOverlay isOpen={isOpen} onDismiss={onDismiss} {...rest}>
		<StyledDialogContent aria-label="modal">
			<Title className="title">{title}</Title>
			<Content className="content">{children}</Content>
		</StyledDialogContent>
	</StyledDialogOverlay>
);

const StyledDialogOverlay = styled(DialogOverlay)`
	background: ${(props) => props.theme.colors.black};
	top: ${HEADER_HEIGHT};
`;

const StyledDialogContent = styled(DialogContent)`
	padding: 0;
	border: 0;
	background: none;
`;

const Title = styled.div`
	text-transform: capitalize;
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.white};
	font-size: 24px;
	line-height: 24px;
	padding-bottom: 24px;
`;
const Content = styled.div``;

export default FullScreenModal;
