import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateCardLimitsDto } from './dto/update-card-limits.dto';
import { CardResponseDto } from './dto/card-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Cards')
@Controller('cards')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new card' })
  @ApiResponse({ status: 201, description: 'Card created successfully', type: CardResponseDto })
  @ApiResponse({ status: 409, description: 'Card number already exists' })
  create(@Body() createCardDto: CreateCardDto, @CurrentUser() currentUser: User) {
    if (currentUser.role === UserRole.ORGANIZATION_ADMIN) {
      createCardDto.organizationId = currentUser.organizationId;
    }
    return this.cardsService.create(createCardDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all cards (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Cards retrieved successfully', type: [CardResponseDto] })
  findAll() {
    return this.cardsService.findAll();
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get cards by organization' })
  @ApiResponse({ status: 200, description: 'Cards retrieved successfully', type: [CardResponseDto] })
  findByOrganization(@Param('organizationId') organizationId: string, @CurrentUser() currentUser: User) {
    const orgId = parseInt(organizationId);
    if (currentUser.role === UserRole.ORGANIZATION_ADMIN && currentUser.organizationId !== orgId) {
      throw new ForbiddenException('Access denied: You can only access cards from your organization');
    }
    return this.cardsService.findByOrganization(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiResponse({ status: 200, description: 'Card retrieved successfully', type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const idNum = parseInt(id);
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return this.cardsService.findOne(idNum);
    }
    
    return this.cardsService.checkAccess(idNum, currentUser.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update card' })
  @ApiResponse({ status: 200, description: 'Card updated successfully', type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async update(@Param('id') id: string, @Body() updateCardDto: UpdateCardDto, @CurrentUser() currentUser: User) {
    const idNum = parseInt(id);
    if (currentUser.role === UserRole.ORGANIZATION_ADMIN) {
      await this.cardsService.checkAccess(idNum, currentUser.organizationId);
    }
    return this.cardsService.update(idNum, updateCardDto);
  }

  @Put(':id/limits')
  @ApiOperation({ summary: 'Update card limits' })
  @ApiResponse({ status: 200, description: 'Card limits updated successfully', type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async updateLimits(@Param('id') id: string, @Body() updateLimitsDto: UpdateCardLimitsDto, @CurrentUser() currentUser: User) {
    const idNum = parseInt(id);
    if (currentUser.role === UserRole.ORGANIZATION_ADMIN) {
      await this.cardsService.checkAccess(idNum, currentUser.organizationId);
    }
    return this.cardsService.updateLimits(idNum, updateLimitsDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate card' })
  @ApiResponse({ status: 200, description: 'Card deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const idNum = parseInt(id);
    if (currentUser.role === UserRole.ORGANIZATION_ADMIN) {
      await this.cardsService.checkAccess(idNum, currentUser.organizationId);
    }
    return this.cardsService.remove(idNum);
  }
}