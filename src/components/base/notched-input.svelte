<script lang="ts">
  type Props = {
    id: string;
    label: string;
    value: string;
    type?: "text" | "search";
    placeholder?: string;
    className?: string;
  };

  let {
    id,
    label,
    value = $bindable(),
    type = "text",
    placeholder,
    className = "",
  }: Props = $props();
</script>

<label class={`notched-field block ${className}`} for={id}>
  <span class="notched-field-label">{label}</span>
  <input
    {id}
    {type}
    {placeholder}
    bind:value
    class="h-full w-full min-w-0 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground md:text-sm"
  />
</label>
