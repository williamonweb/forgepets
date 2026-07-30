import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(){
 const session=await getSession();
 if(!session) return NextResponse.json({message:'Sessão inválida.'},{status:401});
 const user=await prisma.user.findUnique({where:{id:session.userId},select:{id:true,name:true,email:true,role:true,active:true,companyId:true,company:{select:{name:true,tradeName:true}}}});
 if(!user||!user.active) return NextResponse.json({message:'Usuário não encontrado.'},{status:404});
 return NextResponse.json({user});
}
export async function PATCH(request:Request){
 const session=await getSession();
 if(!session) return NextResponse.json({message:'Sessão inválida.'},{status:401});
 const body=await request.json().catch(()=>({}));
 const name=String(body.name||'').trim();const email=String(body.email||'').trim().toLowerCase();const password=String(body.password||'');
 if(!name||!email) return NextResponse.json({message:'Informe nome e e-mail.'},{status:400});
 if(password&&password.length<6) return NextResponse.json({message:'A senha deve ter pelo menos 6 caracteres.'},{status:400});
 const existing=await prisma.user.findFirst({where:{email,id:{not:session.userId}},select:{id:true}});
 if(existing) return NextResponse.json({message:'Este e-mail já está cadastrado.'},{status:409});
 const data:any={name,email};if(password)data.passwordHash=await bcrypt.hash(password,10);
 const user=await prisma.user.update({where:{id:session.userId},data,select:{id:true,name:true,email:true,role:true,active:true,companyId:true}});
 return NextResponse.json({user});
}
