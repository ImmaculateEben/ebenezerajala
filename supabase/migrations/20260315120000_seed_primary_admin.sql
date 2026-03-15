insert into public.admin_users (email, role)
values ('ebenezerajala1305@gmail.com', 'admin')
on conflict (email) do update
set role = 'admin'
where public.admin_users.role is distinct from 'admin';
