import { IsBoolean, IsMongoId } from "class-validator";

// dto/follow-user.dto.ts
export class FollowUserDto {
  @IsMongoId()
  targetUserId: string;
}

// dto/respond-follow-request.dto.ts
export class RespondFollowRequestDto {
  @IsMongoId()
  requestId: string;
  
  @IsBoolean()
  accept: boolean;
}   