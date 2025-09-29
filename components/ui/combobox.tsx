"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox(props) {
  const {
    options = [],
    value = "",
    onValueChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    allowCustom = true,
  } = props

  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const displayValue = React.useMemo(() => {
    const selectedOption = options.find((option) => option.value === value || option.label === value)
    return selectedOption ? selectedOption.label : value
  }, [options, value])

  const handleSelect = (selectedValue) => {
    const selectedOption = options.find((option) => option.value === selectedValue)
    if (selectedOption) {
      onValueChange(selectedOption.label, selectedOption.account)
    } else if (allowCustom && searchValue) {
      onValueChange(searchValue)
    }
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom && searchValue ? (
                <div 
                  className="px-2 py-2 cursor-pointer hover:bg-gray-100 rounded-sm"
                  onClick={() => handleSelect(searchValue)}
                >
                  Use "{searchValue}"
                </div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) => 
                  option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
                  (option.account && option.account.toLowerCase().includes(searchValue.toLowerCase()))
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.label ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div>{option.label}</div>
                      {option.account && (
                        <div className="text-xs text-gray-500">{option.account}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
