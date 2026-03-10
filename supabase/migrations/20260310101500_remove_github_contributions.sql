drop table if exists public.github_activity_cache;

update public.site_content
set payload = payload #- '{profile,githubUsername}'
where id = 'main'
  and payload #> '{profile,githubUsername}' is not null;

update public.site_content
set payload = payload #- '{settings,githubChartScrollPosition}'
where id = 'main'
  and payload #> '{settings,githubChartScrollPosition}' is not null;
