import { Alert } from '../Alert'
import { Segment } from '../Segment'

export const ErrorPageComponent = ({
  title = 'Oops, error',
  message = 'Something went wrong',
}: {
  title?: string
  message?: string
}) => {
  return (
    <Segment title={title}>
      <Alert color="red">{message}</Alert>
    </Segment>
  )
}
