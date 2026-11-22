import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessRequestsService } from './access-requests.service';
import { AccessRequest } from '../common/models/access-request.model';
import {
  RequestAccessInput,
  ApproveAccessRequestInput,
  RejectAccessRequestInput,
} from '../common/dto/access-request.input';

@Resolver(() => AccessRequest)
export class AccessRequestsResolver {
  constructor(private accessRequestsService: AccessRequestsService) {}

  @Mutation(() => AccessRequest)
  async requestAccess(@Args('input') input: RequestAccessInput) {
    return this.accessRequestsService.create(input);
  }

  @Query(() => [AccessRequest])
  async accessRequests() {
    return this.accessRequestsService.findAll();
  }

  @Query(() => [AccessRequest])
  async pendingAccessRequests() {
    return this.accessRequestsService.findPending();
  }

  @Mutation(() => AccessRequest)
  async approveAccessRequest(@Args('input') input: ApproveAccessRequestInput) {
    return this.accessRequestsService.approve(input.id, input.industry);
  }

  @Mutation(() => AccessRequest)
  async rejectAccessRequest(@Args('input') input: RejectAccessRequestInput) {
    return this.accessRequestsService.reject(input.id);
  }
}
