import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrganizationResponseDto } from '../../organizations/dto/organization-response.dto';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ORGANIZATION_ADMIN })
  role: UserRole;

  @ApiProperty({ example: 1, nullable: true })
  organizationId: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: OrganizationResponseDto, required: false })
  organization?: OrganizationResponseDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}