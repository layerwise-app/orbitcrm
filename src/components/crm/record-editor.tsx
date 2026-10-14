import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Spinner } from '~/components/ui/spinner';
import { lostReasons, relationshipStatuses, stageNames, stages, statusNames, type CrmRecord, type RecordKind } from '~/lib/crm';
import { useWorkspace } from './workspace-context';

type TextField = 'name' | 'email' | 'phone' | 'role' | 'website' | 'industry' | 'closeDate' | 'dueDate' | 'owner';
type LinkField = 'companyId' | 'contactId' | 'dealId';
const nameLabels: Record<RecordKind, string> = { contact: 'Full name', company: 'Company name', deal: 'Deal name', task: 'Task' };

export function RecordEditor({ initial, onClose }: { initial: CrmRecord; onClose: () => void }) {
  const { crm, data, owners, actions } = useWorkspace();
  const [draft, setDraft] = useState(initial);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [error, setError] = useState('');
  const kind = draft.kind;
  const editing = !!initial.id;
  const pending = crm.save.isPending;
  const set = <K extends keyof CrmRecord>(key: K, value: CrmRecord[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const record = { ...draft, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) };
    crm.save.mutate(record, {
      onSuccess: ({ id }) => {
        toast.success(editing ? 'Changes saved' : `${kind[0].toUpperCase()}${kind.slice(1)} created`);
        onClose();
        if (!editing && kind !== 'task') actions.open({ ...record, id });
      },
      onError: (e) => setError(e.message),
    });
  };

  const text = (key: TextField, label: string, type = 'text', extra: Partial<ComponentProps<'input'>> = {}) => (
    <Field label={label} id={`field-${key}`}>
      <Input id={`field-${key}`} type={type} value={draft[key]} maxLength={500} onChange={(e) => set(key, e.target.value)} {...extra} />
    </Field>
  );
  const link = (key: LinkField, label: string, linkKind: RecordKind) => (
    <Field label={label} id={`field-${key}`}>
      <NativeSelect id={`field-${key}`} className='w-full' value={draft[key] ?? ''} onChange={(e) => set(key, e.target.value || null)}>
        <NativeSelectOption value=''>None</NativeSelectOption>
        {data.records
          .filter((r) => r.kind === linkKind)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((r) => (
            <NativeSelectOption key={r.id} value={r.id}>
              {r.name}
            </NativeSelectOption>
          ))}
      </NativeSelect>
    </Field>
  );
  const ownerField = (
    <Field label='Owner' id='field-owner'>
      <Input id='field-owner' list='owner-options' value={draft.owner} maxLength={80} onChange={(e) => set('owner', e.target.value)} />
      <datalist id='owner-options'>
        {owners.map((owner) => (
          <option key={owner} value={owner} />
        ))}
      </datalist>
    </Field>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className='editor sm:max-w-[520px]' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit' : 'New'} {kind}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className='editor-form'>
          {text('name', nameLabels[kind], 'text', { required: true, autoFocus: !editing })}
          {kind === 'contact' && (
            <>
              <Row>
                {text('email', 'Email', 'email')}
                {text('phone', 'Phone', 'tel')}
              </Row>
              <Row>
                {text('role', 'Title')}
                {link('companyId', 'Company', 'company')}
              </Row>
            </>
          )}
          {kind === 'company' && (
            <>
              <Row>
                {text('website', 'Website', 'url', { placeholder: 'https://' })}
                {text('industry', 'Industry')}
              </Row>
              <Row>
                {text('email', 'Email', 'email')}
                {text('phone', 'Phone', 'tel')}
              </Row>
            </>
          )}
          {(kind === 'contact' || kind === 'company') && (
            <Field label='Status' id='field-status'>
              <Select value={draft.status} onValueChange={(value) => set('status', value)}>
                <SelectTrigger id='field-status' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationshipStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusNames[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {kind === 'deal' && (
            <>
              <Row>
                <Field label='Value (USD)' id='field-value'>
                  <Input
                    id='field-value'
                    type='number'
                    inputMode='decimal'
                    min='0'
                    max='1000000000'
                    step='0.01'
                    required
                    className='tnum'
                    value={draft.value / 100}
                    onChange={(e) => set('value', Math.round(Number(e.target.value) * 100))}
                  />
                </Field>
                {text('closeDate', 'Close date', 'date')}
              </Row>
              <Row>
                <Field label='Stage' id='field-stage'>
                  <Select value={draft.status} onValueChange={(value) => set('status', value)}>
                    <SelectTrigger id='field-stage' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stageNames[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {ownerField}
              </Row>
              {draft.status === 'lost' && (
                <Field label='Lost reason' id='field-lost'>
                  <NativeSelect id='field-lost' className='w-full' value={draft.lostReason} onChange={(e) => set('lostReason', e.target.value)}>
                    <NativeSelectOption value=''>Not specified</NativeSelectOption>
                    {lostReasons.map((reason) => (
                      <NativeSelectOption key={reason} value={reason}>
                        {reason}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              <Row>
                {link('companyId', 'Company', 'company')}
                {link('contactId', 'Contact', 'contact')}
              </Row>
            </>
          )}
          {kind === 'task' && (
            <>
              <Row>
                {text('dueDate', 'Due date', 'date')}
                {ownerField}
              </Row>
              <Row>
                {link('contactId', 'Contact', 'contact')}
                {link('dealId', 'Deal', 'deal')}
              </Row>
              <label className='check-row'>
                <Checkbox checked={draft.completed} onCheckedChange={(checked) => set('completed', checked === true)} />
                Completed
              </label>
            </>
          )}
          <Field label='Tags' id='field-tags'>
            <Input id='field-tags' value={tags} placeholder='Comma separated' onChange={(e) => setTags(e.target.value)} />
          </Field>
          {error && (
            <p role='alert' className='form-error'>
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type='submit' disabled={pending}>
              {pending && <Spinner />}
              {editing ? 'Save' : `Create ${kind}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className='field'>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className='field-row'>{children}</div>;
}
