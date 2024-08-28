import React from 'react'
import { string } from 'prop-types'
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
  IssueClosedIcon
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

export default function EventIcon ({
  action,
  event
}) {
  /** @type {import("@primer/octicons-react").Icon} */
  let icon
  if (action && iconMap[`${event}.${action}`]) {
    icon = iconMap[`${event}.${action}`]
  } else if (iconMap[event]) {
    icon = iconMap[event]
  } else {
    icon = PackageIcon
  }

  return <icon />
}

EventIcon.propTypes = {
  action: string,
  event: string
}
