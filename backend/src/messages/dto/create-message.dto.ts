export class CreateMessageDto {
  receiverId?: string;
  content!: string;
  attachments?: any[];
}
