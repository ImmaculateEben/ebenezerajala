-- Add githubChartScrollPosition to site_content settings
-- Valid values: 'right' (default), 'left', 'center', 'default'

update public.site_content
set payload = jsonb_set(
  payload,
  '{settings,githubChartScrollPosition}',
  coalesce(
    payload #> '{settings,githubChartScrollPosition}',
    '"right"'::jsonb
  ),
  true
)
where id = 'main'
  and not (payload -> 'settings' ? 'githubChartScrollPosition');
