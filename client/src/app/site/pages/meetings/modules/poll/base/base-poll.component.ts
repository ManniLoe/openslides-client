import { Directive } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Id } from 'src/app/domain/definitions/key-types';
import { BaseViewModel } from 'src/app/site/base/base-view-model';
import { ViewPoll } from 'src/app/site/pages/meetings/pages/polls';
import { PollState, PollType } from 'src/app/domain/models/poll/poll-constants';
import { TranslateService } from '@ngx-translate/core';
import { PromptService } from 'src/app/ui/modules/prompt-dialog';
import { ChoiceService } from 'src/app/ui/modules/choice-dialog';
import { PollControllerService } from '../services/poll-controller.service/poll-controller.service';
import { MeetingComponentServiceCollectorService } from 'src/app/site/pages/meetings/services/meeting-component-service-collector.service';
import { BaseMeetingComponent } from 'src/app/site/pages/meetings/base/base-meeting.component';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

@Directive()
export abstract class BasePollComponent<C extends BaseViewModel = any> extends BaseMeetingComponent {
    private stateChangePendingSubject = new BehaviorSubject<boolean>(false);

    public readonly stateChangePendingObservable = this.stateChangePendingSubject.asObservable();

    public get poll(): ViewPoll<C> {
        return this._poll;
    }

    public pollStateActions = {
        [PollState.Created]: {
            icon: `play_arrow`,
            css: `start-poll-button`
        },
        [PollState.Started]: {
            icon: `stop`,
            css: `stop-poll-button`
        },
        [PollState.Finished]: {
            icon: `public`,
            css: `publish-poll-button`
        },
        [PollState.Published]: {
            icon: ``,
            css: ``
        }
    };

    public get hideChangeState(): boolean {
        return this._poll.isPublished || (this._poll.isCreated && this._poll.type === PollType.Analog);
    }

    protected _id!: Id;
    protected _poll!: ViewPoll<C>;

    public constructor(
        componentServiceCollector: MeetingComponentServiceCollectorService,
        translate: TranslateService,
        protected promptService: PromptService,
        protected choiceService: ChoiceService,
        protected repo: PollControllerService
    ) {
        super(componentServiceCollector, translate);
    }

    public async nextPollState(): Promise<void> {
        const currentState: PollState = this._poll.state;
        if (currentState === PollState.Created || currentState === PollState.Finished) {
            await this.changeState(this._poll.nextState);
        } else if (currentState === PollState.Started) {
            const title = _(`Are you sure you want to stop this voting?`);
            const STOP_LABEL = _(`Stop`);
            const STOP_PUBLISH_LABEL = _(`Stop & publish`);
            const actions = [STOP_LABEL, STOP_PUBLISH_LABEL];
            const choice = await this.choiceService.open({ title, multiSelect: false, actions });

            if (choice?.action === STOP_LABEL) {
                await this.changeState(PollState.Finished);
            } else if (choice?.action === STOP_PUBLISH_LABEL) {
                await this.changeState(PollState.Published);
            }
        }
    }

    private async changeState(targetState: PollState): Promise<void> {
        this.stateChangePendingSubject.next(true);
        await this.repo.changePollState(this._poll, targetState).catch(this.raiseError);
        this.stateChangePendingSubject.next(false);
    }

    public async resetState(): Promise<void> {
        const title = _(`Are you sure you want to reset this vote?`);
        const content = _(`All votes will be lost.`);
        if (await this.promptService.open(title, content)) {
            this.changeState(PollState.Created);
        }
    }

    /**
     * Handler for the 'delete poll' button
     */
    public async deletePoll(): Promise<void> {
        const title = _(`Are you sure you want to delete this vote?`);
        const content = this._poll.getTitle();
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this._poll);
        }
    }

    protected initializePoll(id: Id): void {
        this._id = id;
        this.loadPoll(this._id);
    }

    /**
     * Hook to listen to changes. A poll is already available.
     */
    protected onAfterUpdatePoll(_poll: ViewPoll<C>): void {}

    protected loadPoll(id: Id): void {
        this.subscriptions.push(
            this.repo.getViewModelObservable(this._id).subscribe(poll => {
                if (poll) {
                    this._poll = poll;
                    this.onAfterUpdatePoll(poll);
                }
            })
        );
    }

    public abstract getDetailLink(): string;
}
