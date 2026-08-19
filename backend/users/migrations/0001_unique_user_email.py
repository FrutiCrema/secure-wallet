from django.db import migrations


class Migration(migrations.Migration):
    """
    Unique email on Django's default User table.

    A custom user model would be a larger change; this index enforces
    uniqueness in MySQL without swapping AUTH_USER_MODEL.
    """

    atomic = False

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE auth_user
                ADD UNIQUE INDEX uniq_auth_user_email (email);
            """,
            reverse_sql="""
                ALTER TABLE auth_user
                DROP INDEX uniq_auth_user_email;
            """,
        ),
    ]
