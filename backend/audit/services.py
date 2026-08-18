from audit.models import AuditLog


def create_audit_log(
    *,
    action,
    user=None,
    request=None,
    resource_type='',
    resource_id='',
    metadata=None,
):
    ip_address = None
    user_agent = ''

    if request is not None:
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

    return AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else '',
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata or {},
    )