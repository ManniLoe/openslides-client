import { Injectable } from '@angular/core';
import { LifecycleService } from '../../../services/lifecycle.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ViewOrganization } from '../view-models/view-organization';
import { AutoupdateService, ModelSubscription } from '../../../services/autoupdate';
import { OrganizationRepositoryService } from '../../../../gateways/repositories/organization-repository.service';
import { ModelRequestService } from 'src/app/site/services/model-request.service';
import { ORGANIZATION_SUBSCRIPTION } from 'src/app/domain/models/organizations/organization';

/**
 * Token to get a resource dedicated to the `logo_web_header` of an organization.
 */
export const WEB_HEADER_TOKEN = `web_header`;

/**
 * The organization_id is always the 1.
 */
export const ORGANIZATION_ID = 1;

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    public get organizationObservable(): Observable<ViewOrganization | null> {
        return this.organizationSubject.asObservable();
    }

    public get organization(): ViewOrganization | null {
        return this.organizationSubject.value;
    }

    public get currentActiveMeetings(): number {
        return this.organization?.active_meeting_ids?.length || 0;
    }

    private organizationSubject = new BehaviorSubject<ViewOrganization | null>(null);

    private modelSubscription: ModelSubscription | null = null;

    private _hasInitiated = false;

    public constructor(
        private repo: OrganizationRepositoryService,
        private modelRequestService: ModelRequestService,
        lifecycle: LifecycleService
    ) {
        lifecycle.openslidesBooted.subscribe(async () => await this.setupModelSubscription());
        lifecycle.openslidesShutdowned.subscribe(() => this.destroy());
    }

    private destroy(): void {
        if (this.modelSubscription) {
            this.modelSubscription.close();
            this.modelSubscription = null;
        }
    }

    private async setupModelSubscription(): Promise<void> {
        if (!this._hasInitiated) {
            this._hasInitiated = true;
            this.modelRequestService.subscribeTo({
                modelRequest: {
                    viewModelCtor: ViewOrganization,
                    ids: [ORGANIZATION_ID],
                    fieldset: `settings`,
                    additionalFields: [`committee_ids`, `organization_tag_ids`, `theme_ids`]
                },
                subscriptionName: ORGANIZATION_SUBSCRIPTION
            });
            this.repo
                .getViewModelObservable(ORGANIZATION_ID)
                .subscribe(organization => this.organizationSubject.next(organization));
        }
    }
}