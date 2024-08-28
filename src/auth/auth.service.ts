import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from 'src/prisma.service';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login-auth';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}
  
  async create({name, email, password}: CreateAuthDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email
      }
    });

    if(user){
      throw new BadRequestException('User Already exists')
    }

    return await this.prisma.user.create({
     data:{
       name,
       email,
       password: await bcryptjs.hash(password, 10)
     }
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.user.findFirst({
      where:{
        id
      }
    })
  }

  async update(id: string, updateAuthDto: UpdateAuthDto) {
    return await this.prisma.user.update({
      where: {id},
      data: updateAuthDto
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where:{
        id
      }
    })
  }

  async login( {email, password}: LoginDto){
    const user = await this.prisma.user.findUnique({
      where:{
        email
      }
    })

    if(!user){
      throw new UnauthorizedException('email is wrong');
    }
    
    const isPasswordValid = await bcryptjs.compare(password, (await user).password);
    if(!isPasswordValid){
      throw new UnauthorizedException('password is wrong');
    }

    const payload = {email: user.email};

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email
    };

  }
}
