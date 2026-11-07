
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text := upper(coalesce(new.raw_user_meta_data->>'country',''));
begin
  -- Users created without signup metadata (e.g. added by the owner) confirm age/country in onboarding.
  if c = '' and new.raw_user_meta_data->>'dob_confirmed' is null then
    return new;
  end if;
  if coalesce((new.raw_user_meta_data->>'dob_confirmed')::boolean,false) is not true then
    raise exception 'You must confirm you are 18 or over';
  end if;
  if c = '' then raise exception 'Country is required'; end if;
  if c = any(array['FR','BE','SG','AU','CH','IT','PL','TH','TW','CN']) then
    raise exception 'Stakewise is not available in your country';
  end if;
  insert into public.profiles(id,country,dob_confirmed) values (new.id,c,true);
  return new;
end $$;
