<script lang="ts">
  type Option = { value: string; label: string };

  type Props = {
    id: string;
    label: string;
    value: string;
    options: Option[];
    onchange: (value: string) => void;
    className?: string;
  };

  let {
    id,
    label,
    value,
    options,
    onchange,
    className = "",
  }: Props = $props();
</script>

<label class={`notched-field block ${className}`} for={id}>
  <span class="notched-field-label">{label}</span>
  <select
    {id}
    {value}
    onchange={(event) => onchange(event.currentTarget.value)}
    class="h-full w-full min-w-0 bg-transparent px-3 text-base text-foreground outline-none md:text-sm"
  >
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</label>
