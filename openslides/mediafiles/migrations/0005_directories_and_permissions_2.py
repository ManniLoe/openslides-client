# Generated by Django 2.2.2 on 2019-06-28 06:09

import os.path

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import migrations


def copy_filename(apps, schema_editor):
    Mediafile = apps.get_model("mediafiles", "Mediafile")
    for mediafile in Mediafile.objects.all():
        filename = os.path.basename(mediafile.mediafile.name)
        mediafile.original_filename = filename
        mediafile.save(skip_autoupdate=True)


def set_groups_and_delete_old_permissions(apps, schema_editor):
    Mediafile = apps.get_model("mediafiles", "Mediafile")
    mediafile_content_type = ContentType.objects.get(model="mediafile")
    try:
        can_see_hidden = Permission.objects.get(
            codename="can_see_hidden", content_type=mediafile_content_type
        )
        group_ids = [group.id for group in can_see_hidden.group_set.all()]
        for mediafile in Mediafile.objects.filter(hidden=True):
            mediafile.access_groups.set(group_ids)
            mediafile.save(skip_autoupdate=True)

        # Delete permissions
        can_see_hidden.delete()
        Permission.objects.filter(
            codename="can_upload", content_type=mediafile_content_type
        ).delete()
    except Permission.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [("mediafiles", "0004_directories_and_permissions_1")]

    operations = [
        migrations.RunPython(copy_filename),
        migrations.RunPython(set_groups_and_delete_old_permissions),
    ]