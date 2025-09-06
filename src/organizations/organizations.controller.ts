import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Organization created successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 409, description: 'Organization code already exists' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all organizations (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully', type: [OrganizationResponseDto] })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return this.organizationsService.findOne(parseInt(id));
    }
    
    if (currentUser.organizationId !== parseInt(id)) {
      throw new Error('Access denied: You can only access your own organization');
    }

    return this.organizationsService.findOne(parseInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(parseInt(id), updateOrganizationDto);
  }

  @Put(':id/balance')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization balance (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  updateBalance(@Param('id') id: string, @Body() updateBalanceDto: UpdateBalanceDto) {
    return this.organizationsService.updateBalance(parseInt(id), updateBalanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate organization (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(parseInt(id));
  }
}