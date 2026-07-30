import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

const ALLOWED_ROLES: UserRole[] = [UserRole.OWNER, UserRole.MANAGER, UserRole.EMPLOYEE];
export async function GET(){
 const session=await getSession();
 if(!session?.companyId) return NextResponse.json({message:'Sessão inválida.'},{status:401});
 const users=await prisma.user.findMany({where:{companyId:session.companyId},orderBy:[{active:'desc'},{name:'asc'}],select:{id:true,name:true,email:true,role:true,active:true,createdAt:true}});
 return NextResponse.json({users});
}
export async function POST(request:Request){
 const session=await getSession();
 if(!session?.companyId) return NextResponse.json({message:'Sessão inválida.'},{status:401});
 if(!['OWNER','MANAGER'].includes(session.role)) return NextResponse.json({message:'Você não possui permissão para adicionar usuários.'},{status:403});
 const body=await request.json().catch(()=>({}));const name=String(body.name||'').trim();const email=String(body.email||'').trim().toLowerCase();const password=String(body.password||'');const role=String(body.role||'EMPLOYEE') as UserRole;
 if(!name||!email||!password) return NextResponse.json({message:'Preencha nome, e-mail e senha temporária.'},{status:400});
 if(password.length<6) return NextResponse.json({message:'A senha temporária deve ter pelo menos 6 caracteres.'},{status:400});
 if(!ALLOWED_ROLES.includes(role)) return NextResponse.json({message:'Perfil inválido.'},{status:400});
 if(role===UserRole.OWNER&&session.role!=='OWNER') return NextResponse.json({message:'Somente o administrador pode criar outro administrador.'},{status:403});
 const existing=await prisma.user.findUnique({where:{email},select:{id:true}});if(existing)return NextResponse.json({message:'Este e-mail já está cadastrado.'},{status:409});
 const user=await prisma.user.create({data:{companyId:session.companyId,name,email,passwordHash:await bcrypt.hash(password,10),role},select:{id:true,name:true,email:true,role:true,active:true,createdAt:true}});
 return NextResponse.json({user},{status:201});
}
