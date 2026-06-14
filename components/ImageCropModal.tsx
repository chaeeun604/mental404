// Native stub — crop handled by allowsEditing:true in ImagePicker

interface Props {
  visible: boolean
  imageUri: string | null
  onConfirm: (uri: string, base64: string) => void
  onCancel: () => void
}

export default function ImageCropModal(_props: Props) {
  return null
}
