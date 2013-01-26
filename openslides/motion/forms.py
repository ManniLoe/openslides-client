#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the motion app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext as _

from openslides.utils.forms import CssClassMixin
from openslides.utils.person import PersonFormField, MultiplePersonFormField
from .models import Motion


class BaseMotionForm(forms.ModelForm, CssClassMixin):
    """
    Form to automaticly save the version data for a motion.
    """
    class Meta:
        model = Motion
        fields = ()

    def __init__(self, *args, **kwargs):
        self.motion = kwargs.get('instance', None)
        self.initial = kwargs.setdefault('initial', {})
        if self.motion is not None:
            self.initial['title'] = self.motion.title
            self.initial['text'] = self.motion.text
            self.initial['reason'] = self.motion.reason
        super(BaseMotionForm, self).__init__(*args, **kwargs)

    title = forms.CharField(widget=forms.TextInput(), label=_("Title"))
    text = forms.CharField(widget=forms.Textarea(), label=_("Text"))
    reason = forms.CharField(
        widget=forms.Textarea(), required=False, label=_("Reason"))


class MotionSubmitterMixin(forms.ModelForm):
    submitter = MultiplePersonFormField(label=_("Submitter"))

    def __init__(self, *args, **kwargs):
        if self.motion is not None:
            submitter = [submitter.person.person_id for submitter in self.motion.submitter.all()]
            print submitter
            self.initial['submitter'] = submitter
        super(MotionSubmitterMixin, self).__init__(*args, **kwargs)


class MotionSupporterMixin(forms.ModelForm):
    supporter = MultiplePersonFormField(required=False, label=_("Supporters"))


class MotionTrivialChangesMixin(object):
    trivial_change = forms.BooleanField(
        required=False, label=_("Trivial change"),
        help_text=_("Trivial changes don't create a new version."))


class ConfigForm(forms.Form, CssClassMixin):
    motion_min_supporters = forms.IntegerField(
        widget=forms.TextInput(attrs={'class': 'small-input'}),
        label=_("Number of (minimum) required supporters for a motion"),
        initial=4,
        min_value=0,
        max_value=8,
        help_text=_("Choose 0 to disable the supporting system"),
    )
    motion_preamble = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Motion preamble")
    )
    motion_pdf_ballot_papers_selection = forms.ChoiceField(
        widget=forms.Select(),
        required=False,
        label=_("Number of ballot papers (selection)"),
        choices=[
            ("NUMBER_OF_DELEGATES", _("Number of all delegates")),
            ("NUMBER_OF_ALL_PARTICIPANTS", _("Number of all participants")),
            ("CUSTOM_NUMBER", _("Use the following custom number")),
        ]
    )
    motion_pdf_ballot_papers_number = forms.IntegerField(
        widget=forms.TextInput(attrs={'class': 'small-input'}),
        required=False,
        min_value=1,
        label=_("Custom number of ballot papers")
    )
    motion_pdf_title = forms.CharField(
        widget=forms.TextInput(),
        required=False,
        label=_("Title for PDF document (all motions)")
    )
    motion_pdf_preamble = forms.CharField(
        widget=forms.Textarea(),
        required=False,
        label=_("Preamble text for PDF document (all motions)")
    )

    motion_allow_trivial_change = forms.BooleanField(
        label=_("Allow trivial changes"),
        help_text=_('Warning: Trivial changes undermine the motions '
                    'autorisation system.'),
        required=False,
    )
