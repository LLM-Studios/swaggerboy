import { Composer as AuiComposer } from '@assistant-ui/react'
import { FC } from 'react'
import { Card } from '../ui/card'

export const Composer: FC = () => {
	return (
		<Card className="w-full overflow-hidden flex flex-col m-0 border-4 !border-white rounded-2xl bg-white">
			<AuiComposer.Root className="border-0 rounded-xl text-neutral-900 shadow-inner bg-slate-100">
				<AuiComposer.Input autoFocus />
				<AuiComposer.Action />
			</AuiComposer.Root>
		</Card>
	)
}
