import { FC } from 'preact/compat'
import {
  CommentIcon,
  CheckIcon,
  RepoForkedIcon,
  EyeIcon,
  ChecklistIcon,
  UploadIcon,
  GlobeIcon,
  HubotIcon,
  MilestoneIcon,
  ProjectIcon,
  StopIcon,
  NoteIcon,
  RepoPushIcon,
  PackageIcon,
  GitPullRequestIcon,
  BookmarkIcon,
  IssueOpenedIcon,
  IssueClosedIcon,
  IconProps
} from '@primer/octicons-react'

const iconMap = {
  push: RepoPushIcon,
  pull_request: GitPullRequestIcon,
  label: BookmarkIcon,
  'issues.opened': IssueOpenedIcon,
  'issues.closed': IssueClosedIcon,
  issue_comment: CommentIcon,
  status: CheckIcon,
  fork: RepoForkedIcon,
  watch: EyeIcon,
  check_run: ChecklistIcon,
  check_suite: ChecklistIcon,
  deployment: UploadIcon,
  deployment_status: UploadIcon,
  ping: GlobeIcon,
  installation: HubotIcon,
  installation_repositories: HubotIcon,
  milestone: MilestoneIcon,
  project: ProjectIcon,
  project_card: NoteIcon,
  project_column: ProjectIcon,
  repository_vulnerability_alert: StopIcon
}

const EventIcon: FC<{ action?: string; event: string }> = function ({
  action,
  event
}) {
  let Icon: FC<IconProps>
  if (action && iconMap[`${event}.${action}`]) {
    Icon = iconMap[`${event}.${action}`]
  } else if (iconMap[event]) {
    Icon = iconMap[event]
  } else {
    Icon = PackageIcon
  }

  return <Icon />
}
export default EventIcon
