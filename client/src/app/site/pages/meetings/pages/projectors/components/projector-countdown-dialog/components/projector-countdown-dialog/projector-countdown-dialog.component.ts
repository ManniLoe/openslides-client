import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MeetingSettingsService } from 'src/app/site/pages/meetings/services/meeting-settings.service';
import { DurationService } from 'src/app/site/services/duration.service';
import { CountdownDialogData } from '../../definitions';
import { TranslateService } from '@ngx-translate/core';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
    selector: 'os-projector-countdown-dialog',
    templateUrl: './projector-countdown-dialog.component.html',
    styleUrls: ['./projector-countdown-dialog.component.scss']
})
export class ProjectorCountdownDialogComponent implements OnInit {
    /**
     * The form data
     */
    public countdownForm!: FormGroup;

    /**
     * Holds the default time which was set in the config
     */
    private defaultTime: number;

    public constructor(
        meetingSettingsService: MeetingSettingsService,
        private translate: TranslateService,
        private formBuilder: FormBuilder,
        private durationService: DurationService,
        @Inject(MAT_DIALOG_DATA) public data: CountdownDialogData
    ) {
        this.defaultTime = meetingSettingsService.instant(`projector_countdown_warning_time`)!;
    }

    /**
     * Init. Creates the form
     */
    public ngOnInit(): void {
        const time = this.data.duration || this.durationService.durationToString(this.defaultTime, `m`);
        const title = this.data.title || `${_(`Countdown`)} ${this.data.count || 0 + 1}`;

        this.countdownForm = this.formBuilder.group({
            title: [title, Validators.required],
            description: [this.data.description],
            // TODO: custom form validation. This needs to be a valid minute duration
            duration: [time, Validators.required]
        });
    }
}
