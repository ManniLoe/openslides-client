import { Injectable } from '@angular/core';
import { ViewAssignment } from 'src/app/site/pages/meetings/pages/assignments';
import { BaseMeetingRelatedRepository } from '../../base-meeting-related-repository';
import { Assignment } from '../../../../domain/models/assignments/assignment';
import { RepositoryMeetingServiceCollectorService } from '../../repository-meeting-service-collector.service';
import { DEFAULT_FIELDSET, Fieldsets, ROUTING_FIELDSET } from 'src/app/site/services/model-request-builder';
import { Identifiable } from 'src/app/domain/interfaces';
import { createAgendaItem } from '../../agenda';
import { AssignmentAction } from './assignment.action';
import { BaseAgendaItemAndListOfSpeakersContentObjectRepository } from '../../base-agenda-item-and-list-of-speakers-content-object-repository';
import { AgendaItemRepositoryService } from 'src/app/gateways/repositories/agenda';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

@Injectable({
    providedIn: 'root'
})
export class AssignmentRepositoryService extends BaseAgendaItemAndListOfSpeakersContentObjectRepository<
    ViewAssignment,
    Assignment
> {
    constructor(
        repositoryServiceCollector: RepositoryMeetingServiceCollectorService,
        agendaItemRepo: AgendaItemRepositoryService
    ) {
        super(repositoryServiceCollector, Assignment, agendaItemRepo);
    }

    public override getFieldsets(): Fieldsets<Assignment> {
        const routingFields: (keyof Assignment)[] = [`sequential_number`];
        const titleFields: (keyof Assignment)[] = [`title`];
        const listFields: (keyof Assignment)[] = titleFields.concat([`open_posts`, `phase`, `candidate_ids`]);
        return {
            [DEFAULT_FIELDSET]: listFields.concat([
                `description`,
                `default_poll_description`,
                `number_poll_candidates`,
                `agenda_item_id`,
                `poll_ids`,
                `sequential_number`,
                `list_of_speakers_id`
            ]),
            [ROUTING_FIELDSET]: routingFields,
            list: listFields,
            title: titleFields
        };
    }

    public create(partialAssignment: Partial<Assignment>): Promise<Identifiable> {
        partialAssignment.phase = undefined;
        const payload = {
            meeting_id: this.activeMeetingId,
            ...this.getPartialPayload(partialAssignment),
            ...createAgendaItem(partialAssignment)
        };
        return this.sendActionToBackend(AssignmentAction.CREATE, payload);
    }

    public update(update: Partial<Assignment>, viewModel: ViewAssignment): Promise<void> {
        const payload = {
            id: viewModel.id,
            ...this.getPartialPayload(update)
        };
        return this.sendActionToBackend(AssignmentAction.UPDATE, payload);
    }

    public delete(...viewModels: ViewAssignment[]): Promise<void> {
        const payload: Identifiable[] = viewModels.map(model => ({ id: model.id }));
        return this.sendBulkActionToBackend(AssignmentAction.DELETE, payload);
    }

    public getTitle = (viewAssignment: ViewAssignment) => viewAssignment.title;

    public getVerboseName = (plural: boolean = false) => _(plural ? `Elections` : `Election`);

    private getPartialPayload(model: Partial<ViewAssignment>): any {
        return {
            attachment_ids: model.attachment_ids === null ? [] : model.attachment_ids,
            default_poll_description: model.default_poll_description,
            description: model.description,
            number_poll_candidates: model.number_poll_candidates,
            open_posts: model.open_posts,
            phase: model.phase,
            tag_ids: model.tag_ids === null ? [] : model.tag_ids,
            title: model.title
        };
    }
}
