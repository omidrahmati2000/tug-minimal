import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto, TransactionProcessResponseDto } from './dto/transaction-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentFuelStation } from '../common/decorators/fuel-station.decorator';
import { FuelStation } from '../fuel-stations/entities/fuel-station.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('process')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process fuel transaction (Fuel Station Webhook)' })
  @ApiHeader({ name: 'x-api-key', description: 'Fuel station API key' })
  @ApiResponse({
    status: 200,
    description: 'Transaction processed',
    type: TransactionProcessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  async processTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentFuelStation() fuelStation: FuelStation,
  ) {
    const result = await this.transactionsService.processTransaction(createTransactionDto, fuelStation);
    
    if (!result.success) {
      throw new BadRequestException({
        message: result.message,
        rejectionReason: result.rejectionReason,
      });
    }
    
    return result;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all transactions (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully', type: [TransactionResponseDto] })
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get('organization/:organizationId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transactions by organization' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully', type: [TransactionResponseDto] })
  findByOrganization(@Param('organizationId') organizationId: string, @CurrentUser() currentUser: User) {
    if (currentUser.role === UserRole.ORGANIZATION_ADMIN && currentUser.organizationId !== parseInt(organizationId)) {
      throw new Error('Access denied: You can only access transactions from your organization');
    }
    return this.transactionsService.findByOrganization(parseInt(organizationId));
  }

  @Get('card/:cardId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transactions by card' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully', type: [TransactionResponseDto] })
  findByCard(@Param('cardId') cardId: string) {
    return this.transactionsService.findByCard(parseInt(cardId));
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(parseInt(id));
  }
}